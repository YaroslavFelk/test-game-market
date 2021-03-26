import React, {useContext, useEffect, useState} from 'react';
import {BuyStatus, Purchase, UserShortInfo} from '../../data/types';
import {APIContext, CurrentUserContext} from "../Context";
import {Loading} from "../Common/Loading";
import {Checkbox} from "../Common/Checkbox";
import './PurchaseForm.css';
import {TextInput} from "../Common/TextInput";

interface PurchaseFormProps {
  value: Purchase;
  onChange: (value: Purchase) => void;
  buyStatus?: BuyStatus;
}

export function PurchaseForm({value, buyStatus, onChange}: PurchaseFormProps) {
  const {game: {restrictions}} = value
  const [friends, setFriends] = useState<Array<UserShortInfo> | null>(null)
  const [ageAlert, setAgeAlert] = useState<string>('')
  const [inviteActive, setInviteActive] = useState<boolean>(false)

  const currentUser = useContext(CurrentUserContext)
  const api = useContext(APIContext)

  useEffect(() => {
    if (currentUser?.id) {
      api.users.fetchFriends({userId: currentUser.id}).then(setFriends);
    }
  }, [api]);

  if (!friends) {
    return <Loading/>;
  }

  function toggleUser(checked: boolean, user: UserShortInfo) {
    if (checked) {
      if (!restrictions?.minAge || (user.age && user.age >= restrictions?.minAge)) {
        onChange({...value, userIds: [...(value.userIds ?? []), user.id]})
      } else if (!user.age) {
        setAgeAlert('Cannot be selected unless users age is specified, because the game has age restriction')
      } else {
        setAgeAlert('The person is not allowed to get the game due to age restriction')
      }
    } else {
      onChange({...value, userIds: value.userIds?.filter(userId => userId !== user.id)})
    }
  }

  return (
    <>
      {ageAlert && <div className='alert'>{ageAlert}</div>}

      {currentUser && <Checkbox
          children={'me'}
          checked={!!value.userIds?.length && value.userIds.includes(currentUser?.id)}
          onChange={(checked) => toggleUser(checked, currentUser)}
      />}

      {friends
        .sort((a, b) => a.name > b.name ? 1 : -1)
        .map(friend => <Checkbox
          key={friend.id}
          children={friend.name}
          checked={!!value.userIds?.length && value.userIds.includes(friend.id)}
          onChange={(checked) => toggleUser(checked, friend)}
        />)}


      <div className='inviteFriends'>
        <Checkbox
          children='Invite friends'
          checked={inviteActive}
          onChange={(checked) => setInviteActive(checked)}
        />
        {inviteActive && <>
            <TextInput
                children='Enter Email'
                onChange={(val) => {
                  const stringsArr = val.split(',')
                  let validatedEmails: Array<string> = []
                  stringsArr.map(stringsArr => {
                    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

                    if (re.test(stringsArr)) {
                      validatedEmails.push(stringsArr)
                    }
                  })

                  onChange({...value, emails: validatedEmails})
                }}
            />
            <Checkbox
                children='I acknowledge that Game Market invitation emails will be sent to specified emails. The game will become available to the person only onсe the registration in the Game Market is completed.'
                checked={value.acknowledgeInvite}
                onChange={(checked => onChange({...value, acknowledgeInvite: checked}))}
            />
          {restrictions?.minAge && <Checkbox
              children='I acknowledge that the game has age restriction and might be unavailable if a person is under required age'
              checked={value.acknowledgeInviteAge}
              onChange={(checked => onChange({...value, acknowledgeInviteAge: checked}))}
          />}
        </>}
      </div>
    </>
  )
}


