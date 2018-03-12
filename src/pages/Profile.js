import React from 'react'
import { Button, Card, CardImg, CardText, CardHeader, CardFooter, CardBody, CardTitle, CardSubtitle, Col, Container, Form, FormGroup, Label, Input, FormText, Row  } from 'reactstrap';


export default class Profile extends React.Component {

  render() {
  return (
    <div>

      <Container fluid>
      <Row>

        <Col sm="7">
            <Card>
              <CardBody className="card-body">
              <CardImg top src="https://placeholdit.imgix.net/~text?txtsize=33&txt=180%C3%97180&w=180&h=180" alt="Card image cap" /><p/>
                <CardTitle>First Name Last Name</CardTitle>
                <p>Age | Gender</p>
                <Button className="cool-button">Edit </Button>
              </CardBody>
              <CardFooter>Bio goes here</CardFooter>
            </Card>
        </Col>

        <Col sm="5">
          <Card>
            <CardBody className="card-body">
            <h2>Preferences</h2>
            </CardBody>

            <CardFooter>
             <Form>

        <FormGroup>
          <legend>Age Range</legend>
          <Label for="exampleSelect">From</Label>
          <Input type="select" name="select" id="exampleSelect">
            <option>18</option>
            <option>19</option>
            <option>20</option>
            <option>21</option>
            <option>22</option>
            <option>23</option>
            <option>24</option>
            <option>25</option>
            <option>26</option>
            <option>27</option>
            <option>28</option>
            <option>29</option>
            <option>30</option>
            <option>31</option>
            <option>32</option>
            <option>33</option>
            <option>34</option>
            <option>35</option>
            <option>36</option>
            <option>37</option>
            <option>38</option>
            <option>39</option>
            <option>40</option>
            <option>41</option>
            <option>42</option>
            <option>43</option>
            <option>44</option>
            <option>45</option>
            <option>46</option>
            <option>47</option>
            <option>48</option>
            <option>49</option>
            <option>50</option>
            <option>51</option>
            <option>52</option>
            <option>53</option>
            <option>54</option>
            <option>55</option>
            <option>56</option>
            <option>57</option>
            <option>58</option>
            <option>59</option>
            <option>60+</option>
          </Input>
          <Label for="exampleSelect">To</Label>
          <Input type="select" name="select" id="exampleSelect">
            <option>18</option>
            <option>19</option>
            <option>20</option>
            <option>21</option>
            <option>22</option>
            <option>23</option>
            <option>24</option>
            <option>25</option>
            <option>26</option>
            <option>27</option>
            <option>28</option>
            <option>29</option>
            <option>30</option>
            <option>31</option>
            <option>32</option>
            <option>33</option>
            <option>34</option>
            <option>35</option>
            <option>36</option>
            <option>37</option>
            <option>38</option>
            <option>39</option>
            <option>40</option>
            <option>41</option>
            <option>42</option>
            <option>43</option>
            <option>44</option>
            <option>45</option>
            <option>46</option>
            <option>47</option>
            <option>48</option>
            <option>49</option>
            <option>50</option>
            <option>51</option>
            <option>52</option>
            <option>53</option>
            <option>54</option>
            <option>55</option>
            <option>56</option>
            <option>57</option>
            <option>58</option>
            <option>59</option>
            <option>60+</option>
          </Input>
        </FormGroup>

        <FormGroup tag="fieldset">
          <legend>Looking For</legend>
          <FormGroup check>
          <Label check>
            <Input type="checkbox" />{' '}
            Men
          </Label>
          <Label check>
            <Input type="checkbox" />{' '}
            Women
          </Label>
          <Label check>
            <Input type="checkbox" />{' '}
            Other
          </Label>
        </FormGroup>
        </FormGroup>

        <p/><Button className="cool-button2">Submit</Button>
      </Form>

            </CardFooter>
          </Card>
        </Col>

      </Row>
      </Container>
    </div>
    )
  }
}